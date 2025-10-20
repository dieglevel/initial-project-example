import { useAccountControllerRegisterAccount } from "@/api/account/account";

export default function Page() {
	const { data } = useAccountControllerRegisterAccount();

	return <div>{data?.data.username}</div>;
}
