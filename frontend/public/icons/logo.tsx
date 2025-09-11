import React from "react";

type IconProps = {
  size?: number;   // size in px (applied to both width & height)
  color?: string;  // fill color
  className?: string; // optional tailwind/custom classes
};

const Logo: React.FC<IconProps> = ({ size = 24, color = "#00CCB2", className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size + 1} // original svg was 24x25
      viewBox="0 0 24 25"
      fill="none"
      className={className}
    >
      <g clipPath="url(#clip0_88_17)">
        <path d="M7.24575 15.7239C7.41684 15.7727 7.58666 15.8212 7.75865 15.8685V14.7359C5.72118 14.4821 3.00353 13.9324 1.39392 12.6723C1.39995 14.1638 1.37906 14.3987 1.41768 14.9894H2.10111C4.67529 14.9895 5.98199 15.3628 7.24575 15.7239Z" fill={color}/>
        <path d="M16.2449 14.7359V15.8685C17.7296 15.4602 18.9945 14.9894 21.9024 14.9894H22.5858C22.6245 14.3989 22.6036 14.1625 22.6096 12.6723C20.9991 13.9329 18.28 14.4824 16.2449 14.7359Z" fill={color}/>
        <path d="M14.8304 17.6245V14.8795C14.0875 15.0076 13.1998 14.9973 12.0016 14.9973C10.8034 14.9973 9.91567 15.0076 9.17284 14.8795V17.6245C8.25419 17.4828 7.54889 17.2816 6.85697 17.0839C5.63301 16.7342 4.47703 16.4039 2.10091 16.4039H1.60498C4.07553 27.6627 19.9307 27.6565 22.3981 16.4039H21.9023C18.1699 16.4039 17.4109 17.2263 14.8304 17.6245Z" fill={color}/>
        <path d="M22.6096 10.0391C22.6096 8.23745 19.6021 7.21132 16.2449 6.76923V13.3091C19.6021 12.867 22.6096 11.8408 22.6096 10.0391Z" fill={color}/>
        <path d="M7.75857 13.3091V6.76923C-0.737172 7.7691 -0.728827 12.3114 7.75857 13.3091Z" fill={color}/>
        <path d="M14.8304 5.79602H9.17285V9.33198H14.8304C14.8304 8.9212 14.8304 6.39025 14.8304 5.79602Z" fill={color}/>
        <path d="M14.8304 13.4603V10.7463H9.17285V13.4603C11.0132 13.6137 12.9931 13.6132 14.8304 13.4603Z" fill={color}/>
        <path d="M9.17285 0.845642H14.8304V4.38161H9.17285V0.845642Z" fill={color}/>
      </g>
      <defs>
        <clipPath id="clip0_88_17">
          <rect width="24" height="24" fill="white" transform="translate(0 0.845642)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Logo;
