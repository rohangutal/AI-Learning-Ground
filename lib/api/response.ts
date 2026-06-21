import { NextResponse } from "next/server";

type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data, status }, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error, status }, { status });
}

export function unauthorizedResponse(error = "Unauthorized") {
  return NextResponse.json({ error, status: 401 }, { status: 401 });
}
