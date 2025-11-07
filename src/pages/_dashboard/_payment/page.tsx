import { useBreadcrumStore } from "../store/breadcrumb.slice";
import PaymentCard from "./components/Card";
import PaymentMethodCard from "./components/Payment";

export default function PaymentPage() {
	const { data, set } = useBreadcrumStore();
	return (
		<div className="flex w-full justify-start items-center h-full flex-col gap-4">
			{JSON.stringify(data)}
			<button
				onClick={() =>
					set([
						{ name: "Dashboard", path: "/dashboard" },
						{ name: "Payment", path: null },
					])
				}
			>
				Set Breadcrumb
			</button>

			<button
				onClick={() => set([{ name: "Dashboard", path: "/dashboard" }])}
			>
				Set Breadcrumb
			</button>
			<PaymentCard />
			<PaymentMethodCard />
		</div>
	);
}
