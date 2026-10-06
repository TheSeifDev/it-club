import AboutClub from '@/src/components/interview/Home/About/AboutClub'
import HeroSection from '@/src/components/interview/Home/Hero/HeroSection'
import TrackSection from '@/src/components/interview/Home/Tracks/TrackSection'
import ResponsiveNav from '@/src/components/interview/navigation/ResponsiveNav'
import React from 'react'

const HomePage = () => {
  return (
    <>
    <ResponsiveNav />
    <HeroSection />
    <AboutClub />
    <TrackSection />
    </>
  )
}

export default HomePage