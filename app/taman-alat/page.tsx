import type { Metadata } from "next"
import WeatherParkClient from "@/components/taman-alat/WeatherParkClient"

export const metadata: Metadata = { title: "Taman Alat 3D", description: "Simulasi 3D taman alat meteorologi Jerukagung dengan mode Live dan eksperimen parametrik." }

export default function TamanAlatPage() { return <WeatherParkClient /> }