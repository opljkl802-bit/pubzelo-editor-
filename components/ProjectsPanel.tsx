import React from 'react';
import type { Project } from '../types';

interface ProjectsPanelProps {
  projects: Project[];
  onLoadProject: (project: Project) => void;
}

const ProjectsPanel: React.FC<ProjectsPanelProps> = ({ projects, onLoadProject }) => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl animate-fade-in">
      <h3 className="text-lg font-semibold text-cyan-300">My Projects</h3>
      {projects.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 -mb-2">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => onLoadProject(project)}
              className="group relative flex-shrink-0 w-32 h-32 bg-slate-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-fuchsia-500 focus:border-fuchsia-500 focus:outline-none transition-all"
              title={`Load project from ${new Date(project.timestamp).toLocaleString()}`}
            >
              <img
                src={project.resultImageUrl}
                alt={project.prompt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                <p className="text-white text-xs text-center p-1">Load Project</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">Your saved projects will appear here.</p>
      )}
    </div>
  );
};

export default ProjectsPanel;
