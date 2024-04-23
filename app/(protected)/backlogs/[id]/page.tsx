export default async function Page(props) {
  console.log(props);
  return <div className="container">{props.params.id}</div>;
}
