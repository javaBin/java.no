// import "../styles/globals.css";
import "../../public/assets/bootstrap/css/bootstrap.min.css";
import "../../public/assets/font-awesome/css/font-awesome.min.css";
import "../styles/style.scss";
import { AppType } from "next/app";

const MyApp: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default MyApp;
