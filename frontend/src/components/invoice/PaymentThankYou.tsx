import { Link } from "react-router" 
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ThankYou() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="flex flex-col items-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <CardTitle className="text-3xl font-bold">Cảm ơn bạn!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Thanh toán của bạn đã được xử lý thành công.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Link to="/invoices">
            <Button className="w-full">Trở về Trang chủ</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
