import { useEffect, useMemo } from 'react';
import { StackScreen } from '@/components/custom/StackScreen';
import { StudentDashboard } from '@/features/home/components/StudentDashboard';
import { DashboardSkeleton } from '@/components/custom/Skeletons';
import { buildStudentDashboard, EMPTY_DASHBOARD } from '@/features/home/dashboardStats';
import { useAllocatedCoursePacks } from '@/queries/useCourses';
import { useStudentBootstrap } from '@/queries/useBootstrap';
import { useAuthStore } from '@/store/useAuthStore';

export function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: bootstrap, isLoading: bootstrapLoading } = useStudentBootstrap();
  const packsQuery = useAllocatedCoursePacks();

  useEffect(() => {
    if (bootstrap?.user) updateUser(bootstrap.user);
  }, [bootstrap?.user, updateUser]);

  const dashboard = useMemo(() => {
    const allocatedCourses =
      packsQuery.data && packsQuery.data.length > 0
        ? packsQuery.data
        : (bootstrap?.allocatedCourses ?? []);
    if (!bootstrap && allocatedCourses.length === 0) return EMPTY_DASHBOARD;
    return buildStudentDashboard({
      allocations: bootstrap?.allocations ?? [],
      allocatedCourses,
      classCalendar: bootstrap?.classCalendar ?? [],
      practicalBookings: bootstrap?.practicalBookings ?? [],
      settings: bootstrap?.settings ?? null,
      userId: bootstrap?.user.id ?? user?.id,
    });
  }, [bootstrap, packsQuery.data, user?.id]);

  const loading =
    (bootstrapLoading && !bootstrap) || (packsQuery.isLoading && !packsQuery.data);

  return (
    <StackScreen title="Dashboard">
      {loading ? <DashboardSkeleton /> : <StudentDashboard data={dashboard} />}
    </StackScreen>
  );
}
