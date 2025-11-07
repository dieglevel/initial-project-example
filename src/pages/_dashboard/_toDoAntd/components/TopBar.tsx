import { Button, Input } from "antd";
import CreateModal from "./CreateModal";
import { useEffect, useState } from "react";
import { useTodoStore } from "../store/todo.slice";
import { useDebounce } from "use-debounce";

export default function TopBar() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { paging, setPaging } = useTodoStore();

	const [searchText, setSearchText] = useState(paging.search);

	const [debouncedSearch] = useDebounce(searchText, 500);

	useEffect(() => {
		setPaging({ ...paging, search: debouncedSearch, page: 1 });
	}, [debouncedSearch]);

	const openModal = () => {
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
	};

	return (
		<div className="flex flex-col justify-start items-start p-4">
			<h1 className="text-xl font-bold">Todo List</h1>
			<div className="flex justify-between items-center w-full mt-4 gap-2">
				<Input
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					placeholder="Search todos..."
					style={{ width: "30%" }}
					allowClear
				/>
				<Button type="primary" onClick={openModal}>
					Add Todo
				</Button>
			</div>

			<CreateModal isOpen={isModalOpen} onClose={closeModal} />
		</div>
	);
}
