import { robots } from "../data/checklists.js";

export default function RobotPicker({ selectedRobots, setSelectedRobots }) {
  const availableOptions = (index) => {
    return robots.filter((robot) => selectedRobots[index] === robot || !selectedRobots.includes(robot));
  };

  const addRobot = () => {
    const nextRobot = robots.find((robot) => !selectedRobots.includes(robot));
    if (!nextRobot) return;
    setSelectedRobots([...selectedRobots, nextRobot]);
  };

  const updateRobot = (index, value) => {
    if (selectedRobots.some((robot, robotIndex) => robot === value && robotIndex !== index)) return;
    setSelectedRobots(selectedRobots.map((robot, robotIndex) => (robotIndex === index ? value : robot)));
  };

  const removeRobot = (index) => {
    if (selectedRobots.length === 1) return;
    setSelectedRobots(selectedRobots.filter((_, robotIndex) => robotIndex !== index));
  };

  return (
    <div className="grid gap-2">
      <div className="form-label">Jaký robot se půjčuje</div>
      <div className="grid gap-2">
        {selectedRobots.map((robot, index) => (
          <div key={`${robot}-${index}`} className="grid grid-cols-[minmax(0,1fr)_76px] items-center gap-2">
            <select
              className="form-input"
              name={`robotName${index + 1}`}
              value={robot}
              aria-label={`Robot ${index + 1}`}
              onChange={(event) => updateRobot(index, event.target.value)}
            >
              {availableOptions(index).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="round-danger no-print"
                type="button"
                aria-label={`Odebrat robota ${robot}`}
                disabled={selectedRobots.length === 1}
                onClick={() => removeRobot(index)}
              >
                ×
              </button>
              <button
                className="round-add no-print"
                type="button"
                aria-label="Přidat robota"
                disabled={selectedRobots.length >= robots.length || index !== selectedRobots.length - 1}
                onClick={addRobot}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
