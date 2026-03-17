import { useState, useEffect, useMemo } from 'react';
import { appStore, type Slice } from '../lib/appStore';

export function useAppStore(...subscribeTo: Slice[]) {
  const [, bump] = useState(0);

  useEffect(() => {
    const unsubscribes = subscribeTo.map(slice =>
      appStore.subscribe(slice, () => bump(v => v + 1))
    );
    return () => unsubscribes.forEach(unsub => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    session: appStore.session,
    users: appStore.users,
    companies: appStore.companies,
    employmentRecords: appStore.employmentRecords,
    leaveTypes: appStore.leaveTypes,
    leaveModels: appStore.leaveModels,
    leaveBalances: appStore.leaveBalances,
    leaveRequests: appStore.leaveRequests,
    holidays: appStore.holidays,
    workflows: appStore.workflows,
    documents: appStore.documents,
    notifications: appStore.currentUserNotifications,
    unreadCount: appStore.unreadNotificationCount,
    auditLogs: appStore.auditLogs,
    departments: appStore.departments,
    reads: appStore,
    actions: appStore,
  };
}
