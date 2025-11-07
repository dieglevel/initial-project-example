import { usePaymentControllerMyCard } from "@/api/payment/payment";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PaymentCard() {
	const { data } = usePaymentControllerMyCard();

	return (
		<Card className="p-4 min-w-[300px]">
			<CardHeader className="font-bold text-lg">Your Card</CardHeader>
			<CardContent>
				{data?.data?.amount != null
					? Math.round(Number(data.data.amount))
					: null}
				$
			</CardContent>
		</Card>
	);
}
