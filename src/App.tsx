import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";

import { InteractiveTray } from "./tray/InteractiveTray";
import { Sidebar } from "./controls/Sidebar";
import RollSpecifier from "./controls/RollSpecifier";

export function App() {
  return (
      <Container disableGutters maxWidth="md">
        <Stack direction="row" justifyContent="start">
          <Sidebar />
        <Stack direction="column">
          <InteractiveTray />
          <RollSpecifier/>
        </Stack>
        </Stack>
      </Container>
  );
}
