export default async function AdminPage() {
 const session = await getServerSession();
 if (!session) redirect("/admin/login");
 
 const bundle = await getDraftBundle();
 const stats = await getDashboardStats();
 const media = await listMedia();
 
 // ✅ Sérialiser tout
 const initial = JSON.parse(JSON.stringify({
 ...bundle, 
 csrfToken: session.csrf, 
 stats, 
 media, 
 username: adminUsername() 
 }));
 
 return <AdminDashboard initial={initial} />;
}
