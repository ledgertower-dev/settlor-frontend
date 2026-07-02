import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function DashboardIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.333 2.5H3.333C2.873 2.5 2.5 2.873 2.5 3.333V8.333C2.5 8.793 2.873 9.167 3.333 9.167H8.333C8.793 9.167 9.167 8.793 9.167 8.333V3.333C9.167 2.873 8.793 2.5 8.333 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.667 2.5H11.667C11.207 2.5 10.833 2.873 10.833 3.333V5.833C10.833 6.293 11.207 6.667 11.667 6.667H16.667C17.127 6.667 17.5 6.293 17.5 5.833V3.333C17.5 2.873 17.127 2.5 16.667 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.667 10.833H11.667C11.207 10.833 10.833 11.207 10.833 11.667V16.667C10.833 17.127 11.207 17.5 11.667 17.5H16.667C17.127 17.5 17.5 17.127 17.5 16.667V11.667C17.5 11.207 17.127 10.833 16.667 10.833Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.333 13.333H3.333C2.873 13.333 2.5 13.707 2.5 14.167V16.667C2.5 17.127 2.873 17.5 3.333 17.5H8.333C8.793 17.5 9.167 17.127 9.167 16.667V14.167C9.167 13.707 8.793 13.333 8.333 13.333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MerchantsIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.333 17.5V4.167C13.333 3.706 12.96 3.333 12.5 3.333H4.167C3.706 3.333 3.333 3.706 3.333 4.167V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.667 17.5V8.333C16.667 7.873 16.293 7.5 15.833 7.5H13.333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.667 6.667H9.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 10H9.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.667 13.333H9.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 17.5H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function SummaryIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.833 2.5H4.167C3.706 2.5 3.333 2.873 3.333 3.333V16.667C3.333 17.127 3.706 17.5 4.167 17.5H15.833C16.294 17.5 16.667 17.127 16.667 16.667V3.333C16.667 2.873 16.294 2.5 15.833 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.667 6.667H13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.667 10H13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.667 13.333H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function DepositPayoutIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 2.5V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 7.5L10 2.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.333 17.5H16.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PayoutTransactionIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M2.5 5.833H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 10H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 14.167H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="5.833" r="1.25" fill="currentColor" />
      <circle cx="10" cy="10" r="1.25" fill="currentColor" />
      <circle cx="15" cy="14.167" r="1.25" fill="currentColor" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.167 12.5C16.0557 12.7513 16.0234 13.0302 16.0742 13.2999C16.1251 13.5697 16.2568 13.8173 16.4503 14.0083L16.492 14.05C16.6485 14.2064 16.7726 14.3924 16.857 14.597C16.9414 14.8016 16.9846 15.0208 16.9839 15.2421C16.9833 15.4634 16.9389 15.6824 16.8534 15.8864C16.7678 16.0905 16.6427 16.2757 16.4853 16.4312C16.328 16.5867 16.1414 16.7096 15.9363 16.7928C15.7312 16.876 15.5117 16.918 15.2904 16.9162C15.069 16.9143 14.8503 16.8688 14.6466 16.7822C14.4429 16.6956 14.2583 16.5696 14.1037 16.411L14.0627 16.3693C13.8717 16.1758 13.6241 16.0441 13.3544 15.9933C13.0846 15.9424 12.8058 15.9748 12.5544 16.086C12.3083 16.1919 12.0991 16.3682 11.9528 16.5932C11.8066 16.8183 11.7299 17.0822 11.7327 17.3513V17.5C11.7327 17.9421 11.557 18.3661 11.244 18.6786C10.9309 18.991 10.5065 19.1662 10.064 19.1658C9.62151 19.1654 9.19748 18.9895 8.88489 18.6764C8.5723 18.3634 8.39721 17.939 8.39764 17.4965V17.4165C8.39116 17.1391 8.30394 16.8698 8.14645 16.6432C7.98896 16.4166 7.76861 16.2429 7.51377 16.1443C7.26237 16.0331 6.98357 16.0007 6.71383 16.0515C6.44409 16.1024 6.19648 16.2341 6.00545 16.4277L5.96378 16.4693C5.80737 16.6258 5.62137 16.7499 5.41676 16.8343C5.21216 16.9187 4.99293 16.9619 4.77162 16.9613C4.55031 16.9606 4.33135 16.9162 4.12727 16.8307C3.9232 16.7452 3.73797 16.62 3.58249 16.4626C3.42701 16.3053 3.30409 16.1187 3.22088 15.9136C3.13768 15.7085 3.09581 15.489 3.09764 15.2677C3.09947 15.0464 3.14498 14.8277 3.23156 14.624C3.31814 14.4203 3.44413 14.2357 3.60262 14.081L3.64428 14.04C3.83781 13.849 3.96951 13.6014 4.02038 13.3316C4.07125 13.0619 4.03884 12.7831 3.92762 12.5317C3.82177 12.2856 3.64543 12.0764 3.42038 11.9301C3.19534 11.7839 2.93148 11.7072 2.66245 11.71H2.51378C2.07127 11.71 1.64724 11.5344 1.33465 11.2213C1.02206 10.9083 0.846961 10.4839 0.847395 10.0414C0.847828 9.59889 1.02376 9.17487 1.33681 8.86228C1.64986 8.54969 2.07412 8.3746 2.51662 8.37503H2.59662C2.87402 8.36855 3.14333 8.28133 3.36993 8.12384C3.59653 7.96635 3.77026 7.74601 3.86878 7.49117C3.98001 7.23976 4.01241 6.96096 3.96154 6.69122C3.91067 6.42148 3.77898 6.17388 3.58545 5.98284L3.54378 5.94117C3.3873 5.78476 3.26326 5.59876 3.17886 5.39416C3.09447 5.18955 3.05131 4.97032 3.05205 4.74901C3.05279 4.52771 3.09741 4.30874 3.18316 4.10467C3.2689 3.90059 3.39404 3.71536 3.55149 3.55988C3.70895 3.4044 3.89517 3.28148 4.10031 3.19828C4.30546 3.11507 4.52497 3.0732 4.74628 3.07503C4.96759 3.07686 5.18627 3.12237 5.38995 3.20896C5.59363 3.29554 5.77814 3.42153 5.93328 3.58001L5.97495 3.62168C6.16598 3.81521 6.41359 3.94691 6.68333 3.99778C6.95307 4.04865 7.23187 4.01624 7.48328 3.90501H7.53328C7.77935 3.79917 7.98858 3.62283 8.13482 3.39778C8.28107 3.17273 8.35773 2.90888 8.35512 2.63984V2.5C8.35512 2.05749 8.53094 1.63346 8.84399 1.32087C9.15704 1.00828 9.58153 0.833184 10.024 0.833618C10.4665 0.834051 10.8906 1.01 11.2031 1.32305C11.5157 1.6361 11.6908 2.06036 11.6904 2.50284V2.58284C11.6878 2.85188 11.7644 3.11573 11.9107 3.34078C12.0569 3.56583 12.2661 3.74217 12.5122 3.84801C12.7636 3.95924 13.0424 3.99165 13.3122 3.94078C13.5819 3.88991 13.8295 3.75821 14.0206 3.56468L14.0622 3.52301C14.2186 3.36654 14.4047 3.2425 14.6093 3.1581C14.8139 3.07371 15.0331 3.03055 15.2544 3.03128C15.4757 3.03202 15.6947 3.07664 15.8988 3.16239C16.1028 3.24814 16.2881 3.37328 16.4435 3.53073C16.599 3.68818 16.7219 3.8744 16.8051 4.07955C16.8884 4.28469 16.9302 4.5042 16.9284 4.72551C16.9266 4.94682 16.881 5.1655 16.7945 5.36918C16.7079 5.57286 16.5819 5.75737 16.4234 5.91251L16.3817 5.95418C16.1882 6.14521 16.0565 6.39282 16.0056 6.66256C15.9548 6.9323 15.9872 7.2111 16.0984 7.46251V7.51251C16.2043 7.75858 16.3806 7.96781 16.6056 8.11405C16.8307 8.2603 17.0946 8.33696 17.3636 8.33435H17.5C17.9425 8.33435 18.3665 8.51018 18.6791 8.82323C18.9917 9.13627 19.1668 9.56076 19.1664 10.0033C19.166 10.4458 18.99 10.8698 18.677 11.1824C18.3639 11.495 17.9397 11.6701 17.4972 11.6697H17.4172C17.1481 11.6723 16.8843 11.7489 16.6592 11.8952C16.4342 12.0414 16.2578 12.2507 16.152 12.4967L16.167 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.5 17.5H4.167C3.706 17.5 3.333 17.127 3.333 16.667V3.333C3.333 2.873 3.706 2.5 4.167 2.5H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.333 14.167L17.5 10L13.333 5.833"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 10H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PaymentInitiatedIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 2.5V10L14.167 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function PaymentSuccessIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.667 10L9.167 12.5L13.333 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function RefundIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 8.333H12.5C14.341 8.333 15.833 9.826 15.833 11.667C15.833 13.508 14.341 15 12.5 15H8.333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.833 5L2.5 8.333L5.833 11.667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ExpiredIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.5 7.5L7.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 7.5L12.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9.167V13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.875" r="0.625" fill="currentColor" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="9.167" cy="9.167" r="5.833" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M17.5 17.5L13.875 13.875"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="2"
        y="3.333"
        width="12"
        height="10.667"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.333 2V4.667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.667 2V4.667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 6.667H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
