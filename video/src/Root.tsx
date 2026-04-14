import "./index.css";
import { Composition } from "remotion";
import { TradeMindAd } from "./TradeMindAd";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TradeMindAd"
        component={TradeMindAd}
        durationInFrames={1260}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{}}
      />
    </>
  );
};
