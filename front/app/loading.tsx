const Loading = () => {
	return (
		<div className="w-full h-full fixed flex items-center justify-center">
			<div className="animate-spin rounded-full h-[80px] w-[80px]">
				<svg
                    className="h-full w-full"
					viewBox="0 0 102 102"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M50.8549 10.1621C73.3176 10.234 91.4841 28.495 91.4379 50.9425C91.3916 73.39 73.1501 91.5346 50.6873 91.4627C28.2246 91.3908 10.0581 73.1298 10.1043 50.6823C10.1506 28.2348 28.3922 10.0902 50.8549 10.1621Z"
						stroke="#993537"
						stroke-width="20"
					/>
					<ellipse
						cx="13.8238"
						cy="13.78"
						rx="13.8238"
						ry="13.78"
						transform="matrix(0.999995 0.00319945 -0.00206068 0.999998 36.7872 37.1108)"
						fill="#993537"
					/>
					<ellipse
						cx="3.01611"
						cy="3.13183"
						rx="3.01611"
						ry="3.13183"
						transform="matrix(0.999995 0.00319945 -0.00206068 0.999998 47.8694 25.8718)"
						fill="#993537"
					/>
					<ellipse
						cx="3.01611"
						cy="3.13183"
						rx="3.01611"
						ry="3.13183"
						transform="matrix(0.999995 0.00319945 -0.00206068 0.999998 68.4471 41.5967)"
						fill="#993537"
					/>
					<ellipse
						cx="3.01611"
						cy="3.13183"
						rx="3.01611"
						ry="3.13183"
						transform="matrix(0.999995 0.00319945 -0.00206068 0.999998 60.858 65.3745)"
						fill="#993537"
					/>
					<ellipse
						cx="3.26745"
						cy="3.13183"
						rx="3.26745"
						ry="3.13183"
						transform="matrix(0.999995 0.00319945 -0.00206068 0.999998 34.2158 65.2894)"
						fill="#993537"
					/>
					<ellipse
						cx="3.01611"
						cy="3.13183"
						rx="3.01611"
						ry="3.13183"
						transform="matrix(0.999995 0.00319945 -0.00206068 0.999998 26.6686 40.7152)"
						fill="#993537"
					/>
				</svg>
			</div>
		</div>
	);
};

export default Loading;
