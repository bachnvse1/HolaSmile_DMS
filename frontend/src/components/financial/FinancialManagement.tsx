import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialTransactionList } from './FinancialTransactionList';
import { ExpenseApproval } from './ExpenseApproval';
import { useAuth } from '@/hooks/useAuth';

export const FinancialManagement: React.FC = () => {
  const { role } = useAuth();

  // Xác định quyền truy cập dựa trên vai trò
  const isOwner = role === 'Owner';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="transactions" className="w-full">
        {isOwner && (
          <>
            <TabsList className="mb-6">
              <TabsTrigger value="transactions">Giao dịch tài chính</TabsTrigger>
              <TabsTrigger value="approve">Phê duyệt giao dịch</TabsTrigger>
              <TabsTrigger value="approved">Giao dịch đã duyệt</TabsTrigger>
            </TabsList>
          </>
        )}

        {/* Tab Giao dịch tài chính */}
        <TabsContent value="transactions" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách giao dịch tài chính</CardTitle>
              <CardDescription>
                Quản lý các giao dịch thu chi của phòng khám
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialTransactionList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Phê duyệt phiếu chi - Chỉ Owner */}
        {isOwner && (
          <TabsContent value="approve" className="py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Phê duyệt phiếu chi</CardTitle>
                <CardDescription>
                  Xem xét và phê duyệt các phiếu chi chờ duyệt từ lễ tân
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseApproval />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab Phiếu chi đã duyệt - Chỉ Owner */}
        {isOwner && (
          <TabsContent value="approved" className="py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Phiếu chi đã duyệt</CardTitle>
                <CardDescription>
                  Xem danh sách các phiếu chi đã được phê duyệt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseApproval viewOnlyApproved />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};