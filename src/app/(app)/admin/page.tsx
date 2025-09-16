import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Welcome to the admin area."
      />
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a protected admin page. Only users with the 'admin' role can see this.</p>
        </CardContent>
      </Card>
    </>
  );
}
