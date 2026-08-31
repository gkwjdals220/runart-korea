import Image from "next/image";
import Link from "next/link";
export default function Brand({small=false}:{small?:boolean}){
  return <Link className="brand" href="/">
    <Image className="brandLogo" src="/ttunttun-logo.jpeg" width={small?48:62} height={small?48:62} alt="TTWITTUN 러닝 크루 로고"/>
    <div><b>TTWITTUN</b><span>RUNNING · DISCOVER · RECORD</span></div>
  </Link>
}
