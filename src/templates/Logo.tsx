import { AppConfig } from '@/utils/AppConfig';
import Image from 'next/image';

export const Logo = (props: {
  isTextHidden?: boolean;
}) => (
  <div className="flex items-center text-xl font-semibold">
    <Image
      src="/Authentiq-transparent.png"
      alt="Authentiq Logo"
      width={32}
      height={32}
      className="mr-2"
    />
    {!props.isTextHidden && AppConfig.name}
  </div>
);
