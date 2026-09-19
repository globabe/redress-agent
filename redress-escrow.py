# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import genlayer as gl
from genlayer.types import *
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


class Redress(gl.contract.Contract):
    owner: Address
    next_id: u256

    # Storage: we key everything off a mandate_id (string) using TreeMap-style
    # dicts. Lists inside a single record are stored as comma-separated
    # strings since nested arrays aren't supported in contract storage.
    mandate_buyer: gl.storage.TreeMap[str, Address]
    mandate_product: gl.storage.TreeMap[str, str]
    mandate_specs: gl.storage.TreeMap[str, str]         # e.g. "color:black,size:42"
    mandate_max_price: gl.storage.TreeMap[str, u256]
    mandate_deadline_days: gl.storage.TreeMap[str, u256]
    mandate_return_days: gl.storage.TreeMap[str, u256]
    mandate_status: gl.storage.TreeMap[str, str]        # "open" | "fulfilled" | "adjudicated"
    mandate_escrow: gl.storage.TreeMap[str, u256]       # amount locked at create_mandate
    mandate_settled: gl.storage.TreeMap[str, bool]      # prevents double payout

    purchase_product: gl.storage.TreeMap[str, str]
    purchase_specs: gl.storage.TreeMap[str, str]
    purchase_price: gl.storage.TreeMap[str, u256]
    purchase_delivery_days: gl.storage.TreeMap[str, u256]
    purchase_return_days: gl.storage.TreeMap[str, u256]
    purchase_merchant: gl.storage.TreeMap[str, Address]  # who gets paid if FULFILLED

    verdict_result: gl.storage.TreeMap[str, str]        # "FULFILLED" | "BREACH"
    verdict_remedy: gl.storage.TreeMap[str, str]        # "NONE" | "EXCHANGE" | "REFUND" | "RETURN"
    verdict_reason: gl.storage.TreeMap[str, str]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.next_id = 0

    def _new_id(self) -> str:
        current = self.next_id
        self.next_id = self.next_id + 1
        return "mandate_" + str(current)

    # -- write: create the human's stated intent, locking real funds in escrow

    @gl.public.write.payable
    def create_mandate(
        self,
        product: str,
        specs: str,
        max_price: u256,
        deadline_days: u256,
        return_days: u256,
    ) -> str:
        escrow_amount = gl.message.value
        if escrow_amount == 0:
            raise gl.vm.UserError("send the purchase amount as value to create a mandate")

        mandate_id = self._new_id()
        buyer = gl.message.sender_address

        self.mandate_buyer[mandate_id] = buyer
        self.mandate_product[mandate_id] = product
        self.mandate_specs[mandate_id] = specs
        self.mandate_max_price[mandate_id] = max_price
        self.mandate_deadline_days[mandate_id] = deadline_days
        self.mandate_return_days[mandate_id] = return_days
        self.mandate_status[mandate_id] = "open"
        self.mandate_escrow[mandate_id] = escrow_amount
        self.mandate_settled[mandate_id] = False

        return mandate_id

    # -- write: record what the agent actually purchased ------------------

    @gl.public.write
    def record_purchase(
        self,
        mandate_id: str,
        product: str,
        specs: str,
        price: u256,
        delivery_days: u256,
        return_days_offered: u256,
        merchant_address: str,
    ) -> None:
        if mandate_id not in self.mandate_status:
            raise gl.vm.UserError("mandate not found")

        if self.mandate_status[mandate_id] != "open":
            raise gl.vm.UserError("mandate is not open")

        self.purchase_product[mandate_id] = product
        self.purchase_specs[mandate_id] = specs
        self.purchase_price[mandate_id] = price
        self.purchase_delivery_days[mandate_id] = delivery_days
        self.purchase_return_days[mandate_id] = return_days_offered
        self.purchase_merchant[mandate_id] = Address(merchant_address)
        self.mandate_status[mandate_id] = "fulfilled"

    # -- write: GenLayer judges intent vs fulfillment ----------------------

    @gl.public.write
    def adjudicate(self, mandate_id: str) -> str:
        if mandate_id not in self.mandate_status:
            raise gl.vm.UserError("mandate not found")

        if mandate_id not in self.purchase_product:
            raise gl.vm.UserError("no purchase recorded for this mandate")

        intended_product = self.mandate_product[mandate_id]
        intended_specs = self.mandate_specs[mandate_id]
        max_price = self.mandate_max_price[mandate_id]
        deadline_days = self.mandate_deadline_days[mandate_id]
        return_days = self.mandate_return_days[mandate_id]

        bought_product = self.purchase_product[mandate_id]
        bought_specs = self.purchase_specs[mandate_id]
        bought_price = self.purchase_price[mandate_id]
        bought_delivery_days = self.purchase_delivery_days[mandate_id]
        bought_return_days = self.purchase_return_days[mandate_id]

        prompt = (
            "You are judging whether an autonomous shopping agent's purchase "
            "satisfied the human buyer's original stated intent.\n\n"
            "Human's mandate (what they asked for):\n"
            "- Product: " + intended_product + "\n"
            "- Required specs: " + intended_specs + "\n"
            "- Max price: " + str(max_price) + "\n"
            "- Delivery must arrive within: " + str(deadline_days) + " days\n"
            "- Return window required: " + str(return_days) + " days\n\n"
            "What the agent actually purchased:\n"
            "- Product: " + bought_product + "\n"
            "- Actual specs: " + bought_specs + "\n"
            "- Price paid: " + str(bought_price) + "\n"
            "- Delivery time: " + str(bought_delivery_days) + " days\n"
            "- Return window offered: " + str(bought_return_days) + " days\n\n"
            "Judge whether the purchase satisfied the human's intent. The "
            "merchant may have delivered exactly what was ordered, but that "
            "does not matter here -- only whether what was ordered matches "
            "what the human asked for.\n\n"
            "Respond ONLY with a JSON object, no markdown fences, no extra "
            "text:\n"
            '{"result": "FULFILLED" or "BREACH", '
            '"remedy": "NONE" or "EXCHANGE" or "REFUND" or "RETURN", '
            '"reason": "<one short sentence>"}'
        )

        def leader_fn() -> str:
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            leader_text = _strip_fences(str(leaders_res.calldata).strip())
            try:
                leader_parsed = json.loads(leader_text)
            except Exception:
                return False
            if not isinstance(leader_parsed, dict):
                return False
            if leader_parsed.get("result") not in ("FULFILLED", "BREACH"):
                return False
            if leader_parsed.get("remedy") not in ("NONE", "EXCHANGE", "REFUND", "RETURN"):
                return False
            if "reason" not in leader_parsed:
                return False

            # Re-run the same judgment independently rather than trusting the
            # leader's shape alone -- compare the stable decision fields.
            my_text = _strip_fences(str(gl.nondet.exec_prompt(prompt)).strip())
            try:
                my_parsed = json.loads(my_text)
            except Exception:
                return False
            if not isinstance(my_parsed, dict):
                return False

            return (
                my_parsed.get("result") == leader_parsed.get("result")
                and my_parsed.get("remedy") == leader_parsed.get("remedy")
            )

        raw_result = gl.vm.run_nondet_default(leader_fn, validator_fn)

        text = _strip_fences(str(raw_result).strip())
        parsed = json.loads(text)

        self.verdict_result[mandate_id] = parsed["result"]
        self.verdict_remedy[mandate_id] = parsed["remedy"]
        self.verdict_reason[mandate_id] = parsed["reason"]
        self.mandate_status[mandate_id] = "adjudicated"

        self._settle(mandate_id, parsed["result"])

        return parsed["result"]

    def _settle(self, mandate_id: str, result: str) -> None:
        if self.mandate_settled[mandate_id]:
            raise gl.vm.UserError("mandate already settled")

        escrow_amount = self.mandate_escrow[mandate_id]

        if result == "FULFILLED":
            recipient = self.purchase_merchant[mandate_id]
        else:
            # Any BREACH remedy (EXCHANGE, REFUND, RETURN) settles as a full
            # refund to the buyer at this stage. Partial/remedy-specific
            # settlement is a further refinement, not yet built.
            recipient = self.mandate_buyer[mandate_id]

        self.mandate_settled[mandate_id] = True
        _Recipient(recipient).emit_transfer(value=escrow_amount)

    # -- view methods -------------------------------------------------------

    @gl.public.view
    def get_mandate(self, mandate_id: str) -> str:
        if mandate_id not in self.mandate_status:
            raise gl.vm.UserError("mandate not found")

        data = {
            "mandate_id": mandate_id,
            "buyer": str(self.mandate_buyer[mandate_id].as_hex),
            "product": self.mandate_product[mandate_id],
            "specs": self.mandate_specs[mandate_id],
            "max_price": str(self.mandate_max_price[mandate_id]),
            "deadline_days": str(self.mandate_deadline_days[mandate_id]),
            "return_days": str(self.mandate_return_days[mandate_id]),
            "status": self.mandate_status[mandate_id],
            "escrow_amount": str(self.mandate_escrow[mandate_id]),
            "settled": self.mandate_settled[mandate_id],
        }
        return json.dumps(data)

    @gl.public.view
    def get_purchase(self, mandate_id: str) -> str:
        if mandate_id not in self.purchase_product:
            raise gl.vm.UserError("no purchase recorded")

        data = {
            "mandate_id": mandate_id,
            "product": self.purchase_product[mandate_id],
            "specs": self.purchase_specs[mandate_id],
            "price": str(self.purchase_price[mandate_id]),
            "delivery_days": str(self.purchase_delivery_days[mandate_id]),
            "return_days_offered": str(self.purchase_return_days[mandate_id]),
            "merchant": str(self.purchase_merchant[mandate_id].as_hex),
        }
        return json.dumps(data)

    @gl.public.view
    def get_verdict(self, mandate_id: str) -> str:
        if mandate_id not in self.verdict_result:
            raise gl.vm.UserError("no verdict yet")

        data = {
            "mandate_id": mandate_id,
            "result": self.verdict_result[mandate_id],
            "remedy": self.verdict_remedy[mandate_id],
            "reason": self.verdict_reason[mandate_id],
        }
        return json.dumps(data)


def _strip_fences(text: str) -> str:
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                return part
    return text
