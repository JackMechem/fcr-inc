const Loading = () => {
    return (
        <div className="w-full h-full fixed border flex items-center justify-center">
            <div className="animate-spin rounded-full h-[40px] w-[40px] border-t-2 border-accent" />
        </div>
    );
};

export default Loading;
