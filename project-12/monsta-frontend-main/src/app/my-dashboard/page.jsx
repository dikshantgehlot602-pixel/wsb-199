import MyDashboard from "../components/MyDashboard";
import "./page.css";

export const metadata = {
    title: 'My Dashboard - Online Furniture in India',
    description: 'View and manage your Online Furniture account details and orders.',
};

export default function Page() {
    return <MyDashboard/>;
}