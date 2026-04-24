import { getCheckoutData } from "./actions";
import CheckoutClient from "./components/CheckoutClient";

export default async function CheckoutPage() {
    const { isAuthenticated, initialUser } = await getCheckoutData();

    return (
        <CheckoutClient
            isAuthenticated={isAuthenticated}
            initialUser={initialUser}
        />
    );
}
