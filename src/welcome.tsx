import "./welcome.css";

export function Welcome() {
  return (
    <>
      <div className="container">
        <img
          src={require("./assets/background.png")}
          className="image"
          alt="palm trees"
        />
        <div>
          <p className="text">Welcome.We are glad you reached this point.</p>
        </div>
      </div>
    </>
  );
}
