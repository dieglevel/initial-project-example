"use client";

import { useAuthControllerCreate, useAuthControllerGetSomething } from "@/api";
import { BadRequestResponseDto } from "@/api/schemas";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

export default function HomePage() {
  const { data, isLoading } = useAuthControllerGetSomething();
  const { mutate } = useAuthControllerCreate();
  const [error, setError] = useState<Record<string, string>>({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    const email = data.email as string;
    const password = data.password as string;
    const phone = data.phone as string;

    console.log("data", data);

    mutate(
      {
        data: {
          email,
          password,
          phone
        }
      },
      {
        onSuccess(data, variables, context) {
          addToast({
            title: "Success",
            description: "Account created successfully!",
            color: "success"
          });
        },
        onError(error, variables, context) {
          console.error("Error creating account:", error);
          const badResponse = error.response?.data as BadRequestResponseDto;
          addToast({
            title: "Error",
            description: badResponse.message,
            color: "danger"
          });
          setError(
            badResponse.errors.reduce(
              (acc, curr) => {
                acc[curr.field] = curr.messages.join(", ");
                return acc;
              },
              {} as Record<string, string>
            )
          );
        }
      }
    );
  };

  return (
    <Form
      validationBehavior="aria"
      onSubmit={onSubmit}
      validationErrors={error}
    >
    {      isLoading && <p>Loading...</p>}
      {data && (
        <div>
          <h1>Data from API:</h1>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      <Input name="email" label="Email" />
      <Input name="password" label="Password" />
      <Input name="phone" label="Phone" />
      <Button type="submit"> submit</Button>
    </Form>
  );
}
