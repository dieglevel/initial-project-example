import { Button, Flex, Typography } from "antd";

export default function DemoPage() {
  return (
    <>
      <Flex
        vertical
        flex={1}
        justify="start"
        align="start"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <Typography.Title level={1}>Demo Page</Typography.Title>
        <Typography.Title level={2}>Demo Page</Typography.Title>
        <Typography.Title level={3}>Demo Page</Typography.Title>
        <Typography.Title level={4}>Demo Page</Typography.Title>
      </Flex>
      <Flex
        flex={1}
        justify="start"
        align="start"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
        }}
        gap={16}
      >
        <Flex gap={8} style={{ marginBottom: 16 }} vertical>
          <Button type="default">Button</Button>
          <Button type="dashed">Button</Button>
          <Button type="link">Button</Button>
          <Button type="primary">Button</Button>
          <Button type="text">Button</Button>
        </Flex>

        <Flex gap={8} style={{ marginBottom: 16 }} vertical>
          <Button size="large">Button</Button>
          <Button size="middle">Button</Button>
          <Button size="small">Button</Button>
        </Flex>

        <Flex gap={8} style={{ marginBottom: 16 }} vertical>
          <Button variant="dashed" color="primary">
            Button
          </Button>
          <Button variant="filled">Button</Button>
          <Button variant="link">Button</Button>
          <Button variant="outlined">Button</Button>
          <Button variant="solid">Button</Button>
          <Button variant="text">Button</Button>
        </Flex>

        <Flex gap={8} style={{ marginBottom: 16 }} vertical>
          <Button color="primary">Button</Button>
          <Button color="danger">Button</Button>
          <Button color="cyan">Button</Button>
        </Flex>
      </Flex>
    </>
  );
}
