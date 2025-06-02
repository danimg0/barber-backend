export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#000000",
        fontFamily: "Arial, sans-serif",
        color: "#333",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>
        12 horas de despliegue
      </h1>
      <h3 style={{ fontSize: "1.5rem", marginBottom: "20px" }}></h3>
      {/* Place 'brand.png' inside the 'public' directory, e.g., 'public/images/brand.png' */}
      {/* Then use the following: */}
      {/* If using Next.js 13+ with the 'app' directory */}
      {/* Make sure to import the Image component at the top of the file: */}
      {/* import Image from 'next/image'; */}
      <img
        src="/images/brand.png"
        alt="Brand"
        style={{ maxWidth: "50%", height: "auto" }}
      />
    </div>
  );
}
