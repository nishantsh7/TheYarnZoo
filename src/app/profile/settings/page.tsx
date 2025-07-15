
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileSettingsForms from "./ProfileSettingsForms";

export default async function ProfileSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/profile/settings');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Account Settings</CardTitle>
                <CardDescription>Manage your personal details and account security.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProfileSettingsForms 
                    userId={session.user.id} 
                    currentName={session.user.name || ''} 
                />
            </CardContent>
        </Card>
    );
}
