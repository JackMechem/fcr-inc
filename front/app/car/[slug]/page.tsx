import { getCarAndReviews } from "./actions";
import { Car } from "@/app/types/CarTypes";
import { Review } from "@/app/types/ReviewTypes";
import LeftColumn from "./components/layout/leftColumn";
import RightColumn from "./components/layout/rightColumn";
import ImageView from "./components/media/imageView";
import BackButton from "./components/layout/backButton";
import MainBodyContainer from "@/app/components/containers/mainBodyContainer";
import NavHeader from "@/app/components/headers/navHeader";
import PageFooter from "@/app/components/footer/PageFooter";
import styles from "./components/carDetail.module.css";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const { car: carData, reviews } = await getCarAndReviews(slug);

	return (
		<div>
			<NavHeader white={false} />
			<MainBodyContainer className="mt-[20px]">
				<BackButton />
				<ImageView images={carData.images} />
				<div className={styles.twoColRow}>
					<LeftColumn carData={carData} reviews={reviews} />
					<RightColumn carData={carData} />
				</div>
			</MainBodyContainer>
			<PageFooter />
		</div>
	);
};

export default CarPage;
