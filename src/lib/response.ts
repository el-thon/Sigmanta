import { NextResponse } from "next/server";

export const success = (data: unknown, status = 200) => NextResponse.json(data, { status });

export const errorResponse = (message: string, status = 400) => NextResponse.json({ message }, { status });
