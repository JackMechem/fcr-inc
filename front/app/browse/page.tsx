import Image from "next/image";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import { getFilteredCars } from "../lib/CarApi";
import { Car, CarPages } from "../types/CarTypes";
import FilterBar from "./components/filterBar";
import PageButtons from "./components/pageButtons";
import Link from "next/link";
import BrowseHeader from "../components/headers/browseHeader";

interface BrowseSearchParams {
    page?: string;
    pageSize?: string;
    select?: string;
    sortBy?: string;
    sortDir?: string;
    make?: string;
    model?: string;
    modelYear?: string;
    minModelYear?: string;
    maxModelYear?: string;
    transmission?: string;
    drivetrain?: string;
    engineLayout?: string;
    fuel?: string;
    bodyType?: string;
    roofType?: string;
    vehicleClass?: string;
    minHorsepower?: string;
    maxHorsepower?: string;
    minTorque?: string;
    maxTorque?: string;
    minSeats?: string;
    maxSeats?: string;
    minMpg?: string;
    maxMpg?: string;
    minCylinders?: string;
    maxCylinders?: string;
    minGears?: string;
    maxGears?: string;
    minPricePerDay?: string;
    maxPricePerDay?: string;
}

const BrowsePage = async ({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
    const str = (val: string | string[] | undefined): string | undefined =>
        Array.isArray(val) ? val[0] : val;
    const num = (val: string | string[] | undefined): number | undefined =>
        str(val) ? Number(str(val)) : undefined;

    const p = (await searchParams) ?? {};

    const carsPages: CarPages = await getFilteredCars({
        page:           num(p.page),
        pageSize:       num(p.pageSize),
        modelYear:      num(p.modelYear),
        minModelYear:   num(p.minModelYear),
        maxModelYear:   num(p.maxModelYear),
        minHorsepower:  num(p.minHorsepower),
        maxHorsepower:  num(p.maxHorsepower),
        minTorque:      num(p.minTorque),
        maxTorque:      num(p.maxTorque),
        minSeats:       num(p.minSeats),
        maxSeats:       num(p.maxSeats),
        minMpg:         num(p.minMpg),
        maxMpg:         num(p.maxMpg),
        minCylinders:   num(p.minCylinders),
        maxCylinders:   num(p.maxCylinders),
        minGears:       num(p.minGears),
        maxGears:       num(p.maxGears),
        minPricePerDay: num(p.minPricePerDay),
        maxPricePerDay: num(p.maxPricePerDay),
        select:         str(p.select),
        sortBy:         str(p.sortBy),
        sortDir:        str(p.sortDir) as "asc" | "desc" | undefined,
        make:           str(p.make),
        model:          str(p.model),
        transmission:   str(p.transmission),
        drivetrain:     str(p.drivetrain),
        engineLayout:   str(p.engineLayout),
        fuel:           str(p.fuel),
        bodyType:       str(p.bodyType),
        roofType:       str(p.roofType),
        vehicleClass:   str(p.vehicleClass),
    });

    return (
        <>
            <BrowseHeader white={false} />
            <FilterBar />
            <MainBodyContainer className="2xl:px-[200px] lg:px-[50px] py-0">
                <div className="grid md:grid-cols-2 grid-cols-1 w-full gap-[10px] mt-[10px] text-foreground">
                    {carsPages.cars.map((car: Car) => (
                        <Link
                            href={"/car/" + car.vin}
                            key={car.vin}
                            className="bg-primary rounded-lg border border-third shadow-sm shadow-third/50 overflow-clip flex h-[200px]"
                        >
                            <Image
                                src={car.images[0]}
                                alt={car.make}
                                height={500}
                                width={500}
                                className="object-cover w-[40%]"
                            />
                            <div className="w-[60%] px-[25px] py-[15px] flex flex-col justify-between">
                                <div>
                                    <h1 className="text-[16pt] font-[500]">
                                        {car.make} {car.model}
                                    </h1>
                                    <p className="text-foreground-light text-[12pt] leading-[100%]">
                                        {car.modelYear}
                                    </p>
                                </div>
                                <div className="justify-self-end ml-auto flex flex-col justify-end items-end">
                                    <h1 className="text-accent text-[20pt]">
                                        ${car.pricePerDay}
                                        <span className="text-accent/60 text-[12pt]">/day</span>
                                    </h1>
                                    <p className="text-foreground-light text-[10pt] leading-[100%]">
                                        Before taxes
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <PageButtons carsPages={carsPages} />
            </MainBodyContainer>
        </>
    );
};

export default BrowsePage;
