import PaymentCard from "./components/Card";
import PaymentMethodCard from "./components/Payment";

export default function PaymentPage() {
	return (
		<div className="flex w-full justify-start items-center h-full flex-col gap-4">
			<PaymentCard />
			<PaymentMethodCard />
		</div>
	);
}
