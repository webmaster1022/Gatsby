import { Response } from 'node-fetch';
const usedReference = 'my cool ref';
export default function () {
  const x = new Response({});
  anotherSelfReferencedOne();
  return usedReference;
} // such a structure is being generated by regenerator-runtime

function anotherSelfReferencedOne() {
  anotherSelfReferencedOne = () => {};
}

export function anotherFunction() {
  return "test";
}
