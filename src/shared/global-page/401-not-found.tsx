import { Flex, Typography } from "antd";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{ height: "100vh", flexDirection: "column" }}
    >
      <Typography.Title>Page not found</Typography.Title>
      <Typography.Text>404</Typography.Text>
      <Link to={"/"}>
        <Typography.Link>Go back to Home</Typography.Link>
      </Link>
    </Flex>
  );
}
