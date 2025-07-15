
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import { getUserShippingAddressAction } from '@/actions/userProfileActions';
import AddressForm from './AddressForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfileAddressPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/profile/address');
    }

    const shippingAddress = await getUserShippingAddressAction(session.user.id);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-headline">My Shipping Address</CardTitle>
                <CardDescription>Update your default shipping address for faster checkout.</CardDescription>
            </CardHeader>
            <CardContent>
                <AddressForm userId={session.user.id} initialData={shippingAddress} />
            </CardContent>
        </Card>
    );
}
