import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import PaymentForm from "./PaymentForm";

export default function PaymentMethodCard() {
	return (
		<Card className="p-4 min-w-[300px]">
			<CardHeader className="font-bold text-lg">Wanna Pay ?</CardHeader>
			<CardContent>
				<PaymentForm />
			</CardContent>
		</Card>
	);
}
