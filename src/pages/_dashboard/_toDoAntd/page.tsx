import ToDoTable from "./components/table/Table";
import TopBar from "./components/TopBar";

export default function ToDoAntdPage() {
	return (
		<div className="space-y-4">
			<TopBar />
			<ToDoTable />
		</div>
	);
}
