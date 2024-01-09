import { useState, useCallback, FC, useEffect } from "react";
import { User } from "@/lib/types";
import { nanoid } from "nanoid";
import BaseLayout from "@/components/BaseLayout";

export type GetcodeResponse = {
  latitude: number;
  lookupSource: "coordinates";
  longitude: number;
  localityLanguageRequested: "en";
  continent: string;
  continentCode: string;
  countryName: string;
  countryCode: string;
  city: string;
  locality: string;
  postcode: "94043";
  plusCode: "849VCWC8+JG";
};

type RegisterProps = {
  onRegister: (user: User) => void;
};

export const RegisterView: FC<RegisterProps> = ({ onRegister }) => {
  // registration
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  // location
  const [position, setPosition] = useState<GeolocationPosition>();
  const [isGettingPos, setIsGettingPos] = useState(false);
  const [postionError, setPostionError] = useState("");

  void isGettingPos;
  void postionError;

  // query postion
  const getPostion = useCallback(() => {
    if (!navigator.geolocation) {
      setPostionError("Unable to access location");
      setLocation("Unknown");
      return;
    }

    setIsGettingPos(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setIsGettingPos(false);
      },
      (error) => {
        setPostionError(error.message);
        setIsGettingPos(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!position) return;
    (async () => {
      try {
        const link = `https://api.bigdatacloud.net/data/reverse-geocode-client?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}`;
        const response = await fetch(link);
        if (response.ok) {
          const body = (await response.json()) as GetcodeResponse;
          if (body) {
            setLocation(`${body.city} - ${body.countryName}`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [position]);

  const [submitError, setSubmitError] = useState("");
  const onSubmit = async () => {
    try {
      if (!name) {
        setSubmitError("Please enter your name");
        return;
      }

      if (!location) {
        setSubmitError("Please choose your location");
        return;
      }

      const id = nanoid();
      onRegister({
        name,
        id,
        location,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <BaseLayout>
      <div>
        <div>Enter your name</div>
        <input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <div>Location</div>
        {!!location && <div>{location}</div>}
        <button onClick={() => getPostion()}>Choose location</button>
      </div>

      {!!submitError && <div style={{ color: "red" }}>{submitError}</div>}

      <button onClick={() => onSubmit()}>Register</button>
    </BaseLayout>
  );
};
