import NavHeader from "../components/headers/navHeader";
import TitleText from "../components/text/titleText";
import CartContents from "./components/cartContents";
import styles from "./cart.module.css";

const CartPage = () => {
	return (
		<div>
			<NavHeader white={false} />
			<div className={styles.page}>
				<TitleText>Car Cart</TitleText>
				<CartContents />
			</div>
		</div>
	);
};

export default CartPage;
