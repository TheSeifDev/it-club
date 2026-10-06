import React from "react";

import AboutClub from "@/src/components/interview/Home/About/AboutClub";
import HeroSection from "@/src/components/interview/Home/Hero/HeroSection";
import TrackSection from "@/src/components/interview/Home/Tracks/TrackSection";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import InterviewSection from "@/src/components/interview/Interview/InterviewSection";
import HeadsSection from "@/src/components/interview/Interview/HeadsSection";
import SponsorsSection from "@/src/components/interview/Sponsors/SponsorsSection";
import Footer from "@/src/components/interview/Home/Footer";
import JoinSection from "@/src/components/interview/Home/JoinSection";

const HomePage = () => {
  return (
    <>
      <ResponsiveNav />
      <HeroSection />
      <AboutClub />
      <TrackSection />
      <InterviewSection />
      <HeadsSection />
      <SponsorsSection />
      <JoinSection />
      <Footer />
    </>
  );
};

export default HomePage;