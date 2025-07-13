import { Link } from "react-router" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentCancelled() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-500">Thanh toán đã hủy</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Giao dịch của bạn đã bị hủy. Bạn có thể trở về trang chủ.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-x-circle text-red-600 dark:text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <Button asChild className="w-full">
            <Link to="/invoices">Trở về Trang chủ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
