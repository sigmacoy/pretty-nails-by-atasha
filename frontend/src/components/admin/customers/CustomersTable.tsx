'use client';

import { Table, Pagination, Column } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateShort, getInitials, cn } from '@/lib/utils';
import { CustomerListDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { MoreHorizontal, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CustomersTableProps {
  customers: CustomerListDto[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddNote: (customer: CustomerListDto) => void;
}

function renderCustomer(row: CustomerListDto) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
        <p className="text-sm text-muted-foreground">{row.email}</p>
      </div>
    </div>
  );
}

function renderPhone(row: CustomerListDto) {
  if (!row.phone) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span className="text-gray-900 dark:text-gray-100">{row.phone}</span>;
}

function renderRole(row: CustomerListDto) {
  const isAdmin = row.role === 'ADMIN';
  return (
    <Badge variant={isAdmin ? 'default' : 'outline'}>
      {isAdmin ? 'Admin' : 'Customer'}
    </Badge>
  );
}

function renderStats(row: CustomerListDto) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1 text-muted-foreground">
        <span className="font-medium text-gray-900 dark:text-gray-100">{row.bookingCount}</span>
        bookings
      </span>
      <span className="flex items-center gap-1 text-muted-foreground">
        <span className="font-medium text-gray-900 dark:text-gray-100">{row.loyaltyStamps}</span>
        stamps
      </span>
    </div>
  );
}

function renderJoinedDate(row: CustomerListDto) {
  return (
    <div>
      <p className="font-medium text-gray-900 dark:text-gray-100">
        {formatDateShort(row.createdAt)}
      </p>
    </div>
  );
}

function renderActions(row: CustomerListDto, onAddNote: (customer: CustomerListDto) => void) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAddNote(row)}
        className="gap-1.5"
        aria-label={`Add note for ${row.name}`}
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Note</span>
      </Button>
    </div>
  );
}

const columns: Column<CustomerListDto>[] = [
  {
    key: 'customer',
    header: 'Customer',
    render: renderCustomer,
    className: 'min-w-[220px]',
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => <span className="text-gray-900 dark:text-gray-100">{row.email}</span>,
    className: 'min-w-[200px] hidden md:table-cell',
  },
  {
    key: 'phone',
    header: 'Phone',
    render: renderPhone,
    className: 'min-w-[150px] hidden lg:table-cell',
  },
  {
    key: 'role',
    header: 'Role',
    render: renderRole,
    className: 'min-w-[100px]',
  },
  {
    key: 'stats',
    header: 'Activity',
    render: renderStats,
    className: 'min-w-[180px] hidden md:table-cell',
  },
  {
    key: 'joined',
    header: 'Joined',
    render: renderJoinedDate,
    className: 'min-w-[130px]',
  },
];

export function CustomersTable({
  customers,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onAddNote,
}: CustomersTableProps) {
  return (
    <div className="space-y-4">
      <Table
        columns={columns}
        data={customers}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No customers found"
        renderRowActions={(row) => renderActions(row, onAddNote)}
        striped
        hoverable
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
