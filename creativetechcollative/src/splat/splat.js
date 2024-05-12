import React, { useEffect, Suspense } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
  import SceneWithLumaSplats from '../splat/splatscene';

  
  const SplatSlider = () => {
    const settings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
    };
  
    const splatSources = [
      'https://lumalabs.ai/capture/c84946bd-270e-48d2-bc87-914f246012fc',
      'https://lumalabs.ai/capture/67322d2b-bdd2-4a47-afba-65814ee04ac3',
      'https://lumalabs.ai/capture/67322d2b-bdd2-4a47-afba-65814ee04ac3',
      // Add more splat URLs as needed
    ];
  
    return (
      <Slider {...settings}>
        {splatSources.map((source, index) => (
          <div key={index}>
            <SceneWithLumaSplats source={source} />
          </div>
        ))}
      </Slider>
    );
  };
  
  export default SplatSlider;
  