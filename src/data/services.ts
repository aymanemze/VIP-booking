import { Service } from "@/types";

export const services: Service[] = [
    {
        id: "2fe91aac-69d9-4cd4-9662-7c6096655d3a",
        title: "Haircut",
        duration: 30, // 30 min
        price: 30,
        image: "/haircut.jpg",
        category: "barbering",
    },
    {
        id: "13a4365c-4a93-4f27-8f9d-bea026364ca7",
        title: "Beard Trim",
        duration: 25,
        price: 20,
        image: "/beard-trim.jpg",
        category: "barbering",
    },
    {
        id: "6fac428e-77a9-4a48-b60f-4e82e8e1b2de",
        title: "Hair Wash",
        duration: 15,
        price: 10,
        image: "/hair-wash.jpg",
        category: "barbering",
    },
    {
        id: "d72b2718-6b93-4523-8605-57b83fe2c017",
        title: "Hairdressing",
        duration: 15,
        price: 20,
        image: "/hairdressing.jpg",
        category: "barbering",
    },
    {
        id: "bcfb6dfb-24e3-4ed2-be87-359d5e0c1744",
        title: "Curly",
        duration: 10,
        price: 20,
        image: "/hairdressing.jpg", // Reusing hairdressing image
        category: "barbering",
    },
    {
        id: "b6f4ca92-619d-478a-b833-714535e86efc",
        title: "Kids Haircut",
        duration: 30,
        price: 30,
        image: "/haircut.jpg", // Reusing haircut image
        category: "barbering",
    },
];
