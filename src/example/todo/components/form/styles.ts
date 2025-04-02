import styled from "@emotion/styled";

export const Container = styled.section`
  display: flex;
  flex: 1;
  border-radius: 10px;
`;

export const Input = styled.input`
  margin: 0;
  flex: 1;
  padding: 20px 15px;
  outline: none;
  border: 0;
  font-family: "Lato", sans-serif;
  font-weight: 400;
  font-size: 14px;

  &::placeholder {
    color: #cccccc;
  }
`;

export const Button = styled.button`
  padding: 0;
  margin: 0;
  padding: 10px;
  background-color: transparent;
  border-radius: 5px;
  font-weight: bold;
  border: 0;
  outline: none;
  cursor: pointer;
  color: black;
  display: flex;
  place-content: center;
  place-items: center;
  gap: 8px;
  transition: color 0.3s;
  font-family: "Lato", sans-serif;
  font-weight: 400;
  font-size: 14px;

  &:disabled {
    cursor: not-allowed;
    color: #cccccc;
  }

  &:hover {
    text-decoration: underline;
  }
`;
