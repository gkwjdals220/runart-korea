import Image from "next/image";
import Link from "next/link";
export default function Brand({small=false}:{small?:boolean}){
  return <Link className="brand" href="/">
    <Image className="brandLogo" src="/ttunttun-logo.jpeg" width={small?48:62} height={small?48:62} alt="뛰뚠뛰뚠 실제 크루 로고"/>
    <div><b>RUNART KOREA</b><span>TTUNTTUN RUNNING CREW</span></div>
  </Link>
}